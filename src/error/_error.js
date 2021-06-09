const ERROR_CODES = {
  UNEXPECTER_ERROR: "UNEXPECTER_ERROR",

  INVALID_API_PARAMS:'INVALID_API_PARAMS',

  INVALID_CODE: "INVALID_CODE",
  EXPIRED_CODE: "EXPIRED_CODE",
  RESOLVED_CODE: "RESOLVED_CODE",
  REVOKED_CODE: "REVOKED_CODE",
  MAGIC_CODE_INVALID_ACTION: "MAGIC_CODE_INVALID_ACTION",

  OPENGRAPH_NO_DATA: "NO_OPENGRAPH_DATA",

  // Dealing with room logic
  JOIN_ALREADY_MEMBER: 'JOIN_ALREADY_MEMBER',
  TOO_MANY_OWNED_ROOMS: "TOO_MANY_OWNED_ROOMS",
  ALREADY_INVITED: "ALREADY_INVITED",
  UNKNOWN_ROOM: "UNKNOWN_ROOM",
  INVALID_ROOM_CLAIM: "INVALID_ROOM_CLAIM",
  UNAUTHORIZED_ROOM_ACCESS: "UNAUTHORIZED_ROOM_ACCESS",
  ALREADY_CLAIMED: "ALREADY_CLAIMED",
  INCORRECT_ROOM_PASSCODE: 'INCORRECT_ROOM_PASSCODE',
  INVALID_USER_IDENTITY: 'INVALID_USER_IDENTITY',

  // Permissions
  PERMISSION_DENIED: "PERMISSION_DENIED",

  // User logic
  ALREADY_REGISTERED: "ALREADY_REGISTERED",
  UNAUTHORIZED_USER: "UNAUTHORIZED_USER",
  ADMIN_ONLY_RESTRICTED: "ADMIN_ONLY_RESTRICTED",
  NO_SUCH_USER: "NO_SUCH_USER",
  LOG_IN_REQUIRED: "LOG_IN_REQUIRED",

  // Other
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
}

module.exports = {
  code: ERROR_CODES
}
