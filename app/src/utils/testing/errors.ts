class NoErrorThrownError extends Error {}

export async function getError<TError>(call: () => unknown): Promise<TError> {
  try {
    await call()
  } catch (error: unknown) {
    return error as TError
  }

  throw new NoErrorThrownError()
}
