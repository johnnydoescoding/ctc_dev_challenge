import { NextResponse } from 'next/server';

/**
 * Central error -> HTTP response mapper for the API route handlers. Call it
 * from a route's `catch` block so error handling lives in one place:
 *
 *   try {
 *     ...
 *   } catch (err) {
 *     return handleError(err);
 *   }
 *
 * This is a STUB. Right now it always returns a generic 500. A real
 * implementation would inspect the error (validation vs. not-found vs.
 * conflict vs. unexpected) and choose an appropriate status code and shape.
 *
 * This is task A3. The write endpoints from A2 can't return sensible 400s and
 * 404s while every failure funnels into a 500.
 *
 * TODO (A3): map known error types to proper status codes (400, 404, 409, ...)
 * TODO (A3): avoid leaking internal error details in responses
 */
export function handleError(err: unknown): NextResponse {
  if(err instanceof KnownError){
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: 'Request body must contain valid JSON' }, { status: 400 });
  }

  console.error('Unhandled API error:', err);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}

export class KnownError extends Error { 
  status: number
  constructor(status: number, message: string) { 
    super(message); 
    this.name = "KnownError"
    this.status = status;
  }

}

export class DataValidationError extends KnownError { 
  constructor(message: string){
    super(400, message); 
  }
}

export class DuplicateRestrauntError extends KnownError{
  constructor(message: string){
    super(409, message);
  }
}


export class NotFoundError extends KnownError { 
  constructor(message: string){
    super(404, message);
  }
}


//Known errors
//404 missing row
//404 id isn't a positive integer
//400 invalid body
//400 bad input (ex. rating btwn 1-5)
//409 duplicates
//400 malformed json

