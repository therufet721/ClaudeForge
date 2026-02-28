declare module "prompts" {
  const prompts: (
    questions: object | object[],
    options?: {
      onSubmit?: (prompt: unknown, answer: unknown) => boolean;
      onCancel?: (prompt: unknown, answers: Record<string, unknown>) => boolean;
    }
  ) => Promise<Record<string, unknown>>;
  export default prompts;
}
