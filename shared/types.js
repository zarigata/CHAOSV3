"use strict";
/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                         SHARED TYPE DEFINITIONS [CRYPTO-257]                       ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Core type definitions used across frontend and backend                            ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvent = exports.Permission = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["ONLINE"] = "online";
    UserStatus["AWAY"] = "away";
    UserStatus["BUSY"] = "busy";
    UserStatus["APPEAR_OFFLINE"] = "offline";
    UserStatus["INVISIBLE"] = "invisible";
    UserStatus["CUSTOM"] = "custom";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var Permission;
(function (Permission) {
    Permission["ADMINISTRATOR"] = "administrator";
    Permission["MANAGE_SERVER"] = "manage_server";
    Permission["MANAGE_CHANNELS"] = "manage_channels";
    Permission["MANAGE_ROLES"] = "manage_roles";
    Permission["MANAGE_MESSAGES"] = "manage_messages";
    Permission["KICK_MEMBERS"] = "kick_members";
    Permission["BAN_MEMBERS"] = "ban_members";
    Permission["CREATE_INVITE"] = "create_invite";
    Permission["CHANGE_NICKNAME"] = "change_nickname";
    Permission["MANAGE_NICKNAMES"] = "manage_nicknames";
    Permission["READ_MESSAGES"] = "read_messages";
    Permission["SEND_MESSAGES"] = "send_messages";
    Permission["EMBED_LINKS"] = "embed_links";
    Permission["ATTACH_FILES"] = "attach_files";
    Permission["MENTION_EVERYONE"] = "mention_everyone";
    Permission["EXTERNAL_EMOJIS"] = "external_emojis";
    Permission["VOICE_CONNECT"] = "voice_connect";
    Permission["VOICE_SPEAK"] = "voice_speak";
    Permission["VOICE_MUTE_MEMBERS"] = "voice_mute_members";
    Permission["VOICE_DEAFEN_MEMBERS"] = "voice_deafen_members";
    Permission["VOICE_MOVE_MEMBERS"] = "voice_move_members";
    Permission["VOICE_ACTIVITY"] = "voice_activity";
    Permission["PRIORITY_SPEAKER"] = "priority_speaker";
})(Permission || (exports.Permission = Permission = {}));
// ==================== SOCKET EVENTS ====================
var SocketEvent;
(function (SocketEvent) {
    SocketEvent["CONNECT"] = "connect";
    SocketEvent["DISCONNECT"] = "disconnect";
    SocketEvent["USER_CONNECTED"] = "user:connected";
    SocketEvent["USER_DISCONNECTED"] = "user:disconnected";
    SocketEvent["USER_STATUS_CHANGED"] = "user:status_changed";
    SocketEvent["USER_TYPING"] = "user:typing";
    SocketEvent["USER_STOP_TYPING"] = "user:stop_typing";
    SocketEvent["MESSAGE_CREATED"] = "message:created";
    SocketEvent["MESSAGE_UPDATED"] = "message:updated";
    SocketEvent["MESSAGE_DELETED"] = "message:deleted";
    SocketEvent["MESSAGE_REACTION"] = "message:reaction";
    SocketEvent["CALL_INITIATED"] = "call:initiated";
    SocketEvent["CALL_ACCEPTED"] = "call:accepted";
    SocketEvent["CALL_REJECTED"] = "call:rejected";
    SocketEvent["CALL_ENDED"] = "call:ended";
    SocketEvent["SIGNAL_OFFER"] = "signal:offer";
    SocketEvent["SIGNAL_ANSWER"] = "signal:answer";
    SocketEvent["SIGNAL_ICE_CANDIDATE"] = "signal:ice_candidate";
    SocketEvent["CHANNEL_CREATED"] = "channel:created";
    SocketEvent["CHANNEL_UPDATED"] = "channel:updated";
    SocketEvent["CHANNEL_DELETED"] = "channel:deleted";
    SocketEvent["SERVER_CREATED"] = "server:created";
    SocketEvent["SERVER_UPDATED"] = "server:updated";
    SocketEvent["SERVER_DELETED"] = "server:deleted";
    SocketEvent["FRIEND_REQUEST"] = "friend:request";
    SocketEvent["FRIEND_ACCEPTED"] = "friend:accepted";
    SocketEvent["FRIEND_DECLINED"] = "friend:declined";
    SocketEvent["FRIEND_REMOVED"] = "friend:removed";
})(SocketEvent || (exports.SocketEvent = SocketEvent = {}));
