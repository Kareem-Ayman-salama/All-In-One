const codeToKey = {
  INVALID_CREDENTIALS: "invalidCredentials",
  ACCOUNT_EXISTS: "accountExists",
  INVALID_CODE: "invalidCode",
  ACCOUNT_NOT_FOUND: "accountNotFound",
  REGISTRATION_EXPIRED: "registrationExpired",
  AUTH_REQUIRED: "authRequired",
  CURRENT_PASSWORD_INCORRECT: "currentPasswordIncorrect"
};

export function getAuthErrorMessage(error, translations) {
  const key = codeToKey[error?.code];
  return (key && translations.auth[key]) || error?.message || translations.auth.loginError;
}
