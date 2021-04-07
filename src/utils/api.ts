import { ErrorCodes } from '../constants/ErrorCodes';
import { getSessionToken } from './sessionToken';
import { RoomInfo } from '../types/api';

/** TODO: throw one of these on every failed request */
// import { ApiError } from '../errors/ApiError';

const MERCURY_SERVER = process.env.REACT_APP_API_HOST || 'https://test.with.so:8443';

export type BaseResponse = {
  success: boolean;
  message?: string;
  errorCode?: ErrorCodes;
  [key: string]: any;
};

export type InviteDetails = {
  otp: string;
  inviteId: string;
};

export type ApiUser = {
  admin: boolean;
  avatar_url: string | null;
  created_at: string;
  deleted_at: string;
  display_name: string;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  newsletter_opt_in: boolean;
};

export type ApiOpenGraphResult = {
  title: string | null;
  iframeUrl: string | null;
};

export type ApiRoomMember = {
  display_name: string;
  email: string;
  user_id: string;
  avatar_url: string;
  has_accepted: boolean;
};

export type ApiInviteDetails = {
  success: boolean;
  inviteDetails?: InviteDetails[];
};

export type ApiNamedRoom = {
  room_id: string;
  owner_id: string;
  preview_image_url: string;
  display_name: string;
  route: string;
  url_id: string;
};

export enum SERVICE {
  NETLIFY = 'NETLIFY',
  MERCURY = 'MERCURY',
}
class Api {
  async signup(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    receiveMarketing?: boolean;
    inviteOtp?: string;
    inviteId?: string;
    ref?: string | null;
  }) {
    return await this.post<BaseResponse>('/request_create_account', data);
  }

  async completeSignup(otp: string, email: string) {
    return await this.post('/resolve_create_account', { otp, email });
  }

  async requestLoginOtp(data: { email: string; inviteCode?: string; inviteId?: string }) {
    return await this.post('/request_init_session', data);
  }

  async logIn(otp: string, uid: string | null) {
    return await this.post('/resolve_init_session', { otp, uid });
  }

  async getProfile() {
    return await this.post<
      BaseResponse & {
        profile?: {
          user: ApiUser;
          rooms: {
            owned: RoomInfo[];
            member: RoomInfo[];
          };
        };
      }
    >('/user_profile', {});
  }

  async roomCreate(displayName: string) {
    return await this.post<{ newRoom: ApiNamedRoom }>('/room_create', { displayName });
  }

  async roomRename(roomId: string, newDisplayName: string) {
    return await this.post<{ route: string; url_id: string; display_name: string }>('/room_rename', {
      roomId,
      newDisplayName,
    });
  }

  async roomDelete(roomId: string) {
    return await this.post<{ deletedRoomId: number }>('/room_delete', { roomId });
  }

  async sendRoomInvite(roomName: string, email: string) {
    return await this.post<{ newMember: ApiRoomMember }>('/send_room_invite', { roomName, email });
  }

  async cancelRoomInvite(roomName: string, email: string) {
    return await this.post('/revoke_room_invites_and_membership', { roomName, email });
  }

  async removeRoomMember(roomName: string, email: string) {
    return await this.post('/revoke_room_invites_and_membership', { roomName, email });
  }

  async getRoomMembers(roomName: string) {
    return await this.post<{ result: ApiRoomMember[] }>('/room_get_members', { roomName });
  }

  async resolveRoomInvite(otp: string, inviteId: string | null) {
    return await this.post('/resolve_room_invite', { otp, inviteId });
  }

  async registerThroughInvite(data: any, otp: string, inviteId: string | null) {
    return await this.post('/register_through_invite', { data, otp, inviteId });
  }

  async registerThroughClaim(data: any, otp: string, claimId: string | null) {
    return await this.post('/register_through_claim', { data, otp, claimId });
  }

  async resolveRoomClaim(otp: string, claimId: string | null) {
    return await this.post('/resolve_room_claim', { otp, claimId });
  }

  async loggedInEnterRoom(roomName: string) {
    return await this.post<{ token?: string }>('/logged_in_join_room', { roomName });
  }

  async getToken(identity: string, password: string, roomName: string) {
    return await this.post<{ token?: string }>(`/token`, {
      user_identity: identity,
      room_name: roomName,
      passcode: password,
    });
  }

  async adminCreateAndSendClaimEmail(email: string, roomName: string) {
    return await this.post('/admin_create_and_send_claim_email', { email, roomName });
  }

  async adminRoomClaimsData() {
    return await this.post('/admin_room_claims_data', {});
  }

  async unsubscribeFromEmail(otp: string, mlid: string) {
    return await this.post('/unsubscribe', { otp, mlid });
  }

  async getRoomFileUploadUrl(fileName: string, contentType: string) {
    return await this.post<{ uploadUrl: string; downloadUrl: string }>('/get_room_file_upload_url', {
      fileName,
      contentType,
    });
  }

  async deleteFile(fileUrl: string) {
    return await this.post('/delete_file', { fileUrl });
  }

  async getOpenGraph(url: string) {
    return await this.post<{ result: ApiOpenGraphResult }>('/opengraph', {
      url,
    });
  }

  async roomMembershipThroughPublicInviteLink(otp: string, inviteId: string) {
    return await this.post('/room_membership_through_public_invite_link', { otp, inviteId }, SERVICE.MERCURY);
  }

  async enablePublicInviteLink(roomRoute: string) {
    return await this.post('/enable_public_invite_link', { roomRoute }, SERVICE.MERCURY);
  }

  async disablePublicInviteLink(roomRoute: string) {
    return await this.post('/disable_public_invite_link', { roomRoute }, SERVICE.MERCURY);
  }

  async getCurrentPublicInviteLink(roomRoute: string) {
    return await this.post('/get_public_invite_details', { roomRoute }, SERVICE.MERCURY);
  }

  async resetPublicInviteLink(roomRoute: string) {
    return await this.post('/reset_public_invite_link', { roomRoute }, SERVICE.MERCURY);
  }

  async setDefaultRoom(roomRoute: string) {
    return await this.post<BaseResponse>('/set_default_room', { roomRoute }, SERVICE.MERCURY);
  }

  async getDefaultRoom() {
    return this.post<BaseResponse & { room_route: string }>('/get_or_init_default_room', SERVICE.MERCURY);
  }

  async post<Response = {}>(endpoint: string, data?: any, service: SERVICE = SERVICE.NETLIFY) {
    return this.request<Response>({
      method: 'POST',
      endpoint,
      data: data ?? {},
      service,
    });
  }

  async get<Response = {}>(endpoint: string, service?: SERVICE) {
    return this.request<Response>({
      method: 'GET',
      endpoint,
      service,
    });
  }

  private async request<Response>(opts: { method: string; endpoint: string; data?: any; service?: SERVICE }) {
    const { service = SERVICE.NETLIFY, method, endpoint, data } = opts;

    const serviceUrl = this.getServiceUrl(service);

    const response = await fetch(`${serviceUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      return { success: false, message: 'Unexpected error', code: ErrorCodes.UNEXPECTED } as BaseResponse;
    }

    return response.json() as Promise<BaseResponse & Response>;
  }

  private getServiceUrl(service: SERVICE) {
    return service === SERVICE.MERCURY ? MERCURY_SERVER : '/.netlify/functions';
  }

  private getAuthHeaders(): { Authorization: string } | {} {
    const token = getSessionToken();
    return token
      ? {
          Authorization: `Bearer ${btoa(token)}`,
        }
      : {};
  }
}

export default new Api();
