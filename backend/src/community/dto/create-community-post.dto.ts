export class CreateCommunityPostDto {
  userId: string;
  userName: string;
  userInitial: string;
  postText: string;
  postImage?: string;
  postLocation?: string;
}
