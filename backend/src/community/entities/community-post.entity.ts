import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column()
  userInitial: string;

  @Column('text')
  postText: string;

  @Column({ nullable: true })
  postImage?: string;

  @Column({ nullable: true })
  postLocation?: string;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CommunityLike, (like) => like.post)
  likes: CommunityLike[];

  @OneToMany(() => CommunityComment, (comment) => comment.post)
  comments: CommunityComment[];

  // For frontend use only
  isLiked?: boolean;
}

@Entity('community_likes')
export class CommunityLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relation to post
  post?: CommunityPost;
}

@Entity('community_comments')
export class CommunityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column()
  userInitial: string;

  @Column('text')
  commentText: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relation to post
  post?: CommunityPost;
}
