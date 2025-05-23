// Referenced from https://gist.github.com/t3dotgg/a486c4ae66d32bf17c09c73609dacc5b

import { ConvexError } from "convex/values";

type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    if (error instanceof ConvexError) {
      return { data: null, error: error.data as E };
    } else {
      return { data: null, error: "An unexpected error occurred" as E };
    }
  }
}
