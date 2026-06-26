import type { WorkflowStep } from './context_engine.js';

export interface WorkflowStepResult {
  id: string;
  tool: string;
  success: boolean;
  result: any;
  skipped?: boolean;
}

export interface WorkflowResult {
  success: boolean;
  steps: WorkflowStepResult[];
}

type WorkflowExecutor = (tool: string, args: Record<string, any>) => Promise<any>;

const MAX_WORKFLOW_STEPS = 15;

export class WorkflowEngine {
  static parseFromAIResponse(content: string | null | undefined): WorkflowStep[] {
    if (!content) return [];
    const normalized = content.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');

    let parsed: unknown;
    try {
      parsed = JSON.parse(normalized);
    } catch {
      return [];
    }

    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    const steps: WorkflowStep[] = [];
    for (const [index, candidate] of candidates.entries()) {
      if (!candidate || typeof candidate !== 'object') continue;
      const record = candidate as Record<string, unknown>;
      if (typeof record.tool !== 'string') continue;
      const rawArgs = record.params ?? record.args ?? {};
      if (!rawArgs || typeof rawArgs !== 'object' || Array.isArray(rawArgs)) continue;
      const dependsOn = typeof record.dependsOn === 'string'
        ? record.dependsOn
        : Array.isArray(record.dependsOn) && record.dependsOn.every((item) => typeof item === 'string')
          ? record.dependsOn as string[]
          : undefined;
      steps.push({
        id: typeof record.id === 'string' ? record.id : `${record.tool}_${index + 1}`,
        tool: record.tool,
        args: rawArgs as Record<string, unknown>,
        dependsOn,
      });
    }
    return steps;
  }

  static async execute(steps: WorkflowStep[], executor: WorkflowExecutor): Promise<WorkflowResult> {
    if (steps.length > MAX_WORKFLOW_STEPS) {
      return {
        success: false,
        steps: [{
          id: 'plan_limit',
          tool: 'workflow_guard',
          success: false,
          skipped: true,
          result: {
            success: false,
            message: `الطلب يحتوي ${steps.length} خطوة، والحد الأقصى لكل رسالة هو ${MAX_WORKFLOW_STEPS}. اختصر الطلب أو قسّمه على رسالتين.`,
          },
        }],
      };
    }

    const results = new Map<string, WorkflowStepResult>();
    const completed: WorkflowStepResult[] = [];

    for (const step of steps) {
      const dependencies = step.dependsOn
        ? Array.isArray(step.dependsOn) ? step.dependsOn : [step.dependsOn]
        : [];
      const failedDependency = dependencies.find((dependencyId) => !results.get(dependencyId)?.success);
      if (failedDependency) {
        const skipped: WorkflowStepResult = {
          id: step.id,
          tool: step.tool,
          success: false,
          skipped: true,
          result: { success: false, skipped: true, message: `تم تخطي هذه الخطوة لأن الخطوة المعتمدة عليها "${failedDependency}" failed.` },
        };
        results.set(step.id, skipped);
        completed.push(skipped);
        continue;
      }

      const args = this.resolveReferences(step.args, results);
      if (this.containsUnresolvedReference(args)) {
        const unresolved: WorkflowStepResult = {
          id: step.id,
          tool: step.tool,
          success: false,
          skipped: true,
          result: {
            success: false,
            skipped: true,
            message: 'تم تخطي هذه الخطوة لأن مرجع خطوة سابقة لم يُحل إلى ID صحيح.',
          },
        };
        results.set(step.id, unresolved);
        completed.push(unresolved);
        continue;
      }
      try {
        const result = await executor(step.tool, args);
        const completedStep: WorkflowStepResult = {
          id: step.id,
          tool: step.tool,
          success: result?.success !== false,
          result,
        };
        results.set(step.id, completedStep);
        completed.push(completedStep);
      } catch (error) {
        const failedStep: WorkflowStepResult = {
          id: step.id,
          tool: step.tool,
          success: false,
          result: {
            success: false,
            message: error instanceof Error ? error.message : String(error),
          },
        };
        results.set(step.id, failedStep);
        completed.push(failedStep);
      }
    }

    return {
      success: completed.length > 0 && completed.every((step) => step.success),
      steps: completed,
    };
  }

  private static resolveReferences(
    value: unknown,
    results: Map<string, WorkflowStepResult>
  ): any {
    if (Array.isArray(value)) return value.map((item) => this.resolveReferences(item, results));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, this.resolveReferences(item, results)])
      );
    }
    if (typeof value !== 'string' || !value.startsWith('$')) return value;

    const [stepId, ...path] = value.slice(1).split('.');
    let resolved: any = results.get(stepId)?.result;
    for (const segment of path) {
      resolved = this.resolvePathSegment(resolved, segment);
      if (resolved === undefined || resolved === null) break;
    }
    return resolved ?? value;
  }

  private static containsUnresolvedReference(value: unknown): boolean {
    if (typeof value === 'string') return /^\$[a-zA-Z_]/.test(value);
    if (Array.isArray(value)) return value.some((item) => this.containsUnresolvedReference(item));
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).some((item) => this.containsUnresolvedReference(item));
    }
    return false;
  }

  private static resolvePathSegment(source: any, segment: string): any {
    if (source === undefined || source === null) return undefined;
    const parts = [...segment.matchAll(/([^\[\]]+)|\[(\d+)\]/g)];
    if (parts.length === 0) return source?.[segment];

    let current = source;
    for (const part of parts) {
      const propertyName = part[1];
      const arrayIndex = part[2];
      if (propertyName) {
        current = current?.[propertyName];
      } else if (arrayIndex !== undefined) {
        current = Array.isArray(current) ? current[Number(arrayIndex)] : undefined;
      }
      if (current === undefined || current === null) break;
    }
    return current;
  }
}
