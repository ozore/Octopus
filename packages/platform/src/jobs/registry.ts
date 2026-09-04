/**
 * Job handler registry.
 *
 * The queue is shared; the HANDLERS are per app. An app registers what it can
 * do at startup (`registerHandler('kb.refresh', …)`) and the drain route
 * dispatches by `kind`. A job whose kind has no handler is parked as `dead`
 * with a legible error rather than retried five times against a typo.
 */

export type JobHandlerContext = {
  jobId: string;
  attempts: number;
};

export type JobHandler = (
  payload: Record<string, unknown>,
  context: JobHandlerContext,
) => Promise<void>;

export class JobRegistry {
  private readonly handlers = new Map<string, JobHandler>();

  register(kind: string, handler: JobHandler): this {
    if (this.handlers.has(kind)) {
      throw new Error(`JobRegistry: handler for "${kind}" is already registered`);
    }
    this.handlers.set(kind, handler);
    return this;
  }

  /** Replace an existing handler (tests, and an app overriding a platform job). */
  override(kind: string, handler: JobHandler): this {
    this.handlers.set(kind, handler);
    return this;
  }

  get(kind: string): JobHandler | undefined {
    return this.handlers.get(kind);
  }

  kinds(): string[] {
    return [...this.handlers.keys()].sort();
  }
}

export function createJobRegistry(): JobRegistry {
  return new JobRegistry();
}
