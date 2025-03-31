import nodemailer from "nodemailer";

var mailer = nodemailer.createTransport({
  host: Bun.env.EMAIL_HOST,
  port: Number(Bun.env.EMAIL_PORT),
  auth: {
    user: Bun.env.EMAIL_USER,
    pass: Bun.env.EMAIL_PASS,
  },
});

export { mailer };
