function maskEmail(email: string): string {
  if (!email || !email.includes("@")) {
    return email;
  }

  const [username, domain] = email.split("@");

  // Xử lý username có độ dài < 2 ký tự
  if (username.length <= 2) {
    return `${username}@${domain}`;
  }

  // Tối ưu cách tạo masked username
  const maskedUsername = `${username[0]}${"*".repeat(
    username.length - 2
  )}${username.slice(-1)}`;

  return `${maskedUsername}@${domain}`;
}

export { maskEmail };
