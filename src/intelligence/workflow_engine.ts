import type { WorkflowStep } from './context_engine.js';

export interface WorkflowStepResult {
  id: string;
  tool: string;
  success: boolean;
  result: any;
}

export interface WorkflowResult {
  success: boolean;
  steps: WorkflowStepResult[];
}

type WorkflowExecutor = (tool: string, args: Record<string, any>) => Promise<any>;

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
          result: { success: false, message: `Dependency "${failedDependency}" failed.` },
        };
        results.set(step.id, skipped);
        completed.push(skipped);
        continue;
      }

      const args = this.resolveReferences(step.args, results);
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
    for (const segment of path) resolved = resolved?.[segment];
    return resolved ?? value;
  }
}
