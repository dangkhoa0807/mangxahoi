import sanitizeHtml from "sanitize-html";

const sanitizeOptions = {
  allowedTags: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "ul",
    "li",
    "ol",
    "br",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ],
  allowedAttributes: {
    a: ["href", "name", "target"],
    "*": ["style"], // Cho phép thuộc tính style ở tất cả các thẻ
  },
  allowedSchemes: ["http", "https", "mailto"], // Chỉ cho phép các URL an toàn
};

const cleanHtml = (data: string) => {
  return sanitizeHtml(data, sanitizeOptions);
};

export { cleanHtml };
