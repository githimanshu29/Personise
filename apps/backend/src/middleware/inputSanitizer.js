import Joi from "joi";

const chatSchema = Joi.object({
  session_id: Joi.string().required(),
  message: Joi.string().min(1).max(4000).required(),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid("user", "assistant").required(),
        content: Joi.string().min(1).max(4000).required(),
      }),
    )
    .optional(),
});

export function inputSanitizer(req, res, next) {
  const { error, value } = chatSchema.validate(req.body, {
    stripUnknown: true,
  });
  if (error) {
    return res
      .status(400)
      .json({ error: "INVALID_INPUT", message: error.message });
  }
  req.validated = value;
  next();
}
