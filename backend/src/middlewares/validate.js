const HttpError = require('../utils/HttpError');

function formatIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.') || 'general',
    message: issue.message,
  }));
}

function validate(schemas = {}) {
  return (req, res, next) => {
    req.validated = req.validated || {};

    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part]);
      if (!result.success) {
        const details = formatIssues(result.error.issues);
        const firstMessage = details[0]?.message || 'Datos de entrada invalidos';
        return next(new HttpError(400, firstMessage, details));
      }

      req.validated[part] = result.data;
      if (part === 'body') {
        req.body = result.data;
      }
    }

    next();
  };
}

module.exports = validate;
