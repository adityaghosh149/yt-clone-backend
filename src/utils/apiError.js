class APIError extends Error {
    constructor(
        statusCode,
        message = "SOMETHING WENT WRONG!",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.success = statusCode < 400;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { APIError };
