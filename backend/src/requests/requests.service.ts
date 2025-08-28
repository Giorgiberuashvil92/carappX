/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';

type RequestEntity = CreateRequestDto & {
  id: string;
  createdAt: number;
  status: 'open' | 'assigned' | 'closed';
};

@Injectable()
export class RequestsService {
  constructor(private readonly firebase: FirebaseService) {}

  private col() {
    return this.firebase.db.collection('requests');
  }

  async create(createRequestDto: CreateRequestDto) {
    const id = `req_${Date.now()}`;
    const entity: RequestEntity = {
      id,
      createdAt: Date.now(),
      status: 'open',
      ...createRequestDto,
    };
    await this.col().doc(id).set(entity);
    return entity;
  }

  async findAll() {
    const snap = await this.col().orderBy('createdAt', 'desc').get();
    return snap.docs.map((d) => d.data() as RequestEntity);
  }

  async findOne(id: string) {
    const doc = await this.col().doc(id).get();
    return doc.exists ? (doc.data() as RequestEntity) : null;
  }

  async update(id: string, updateRequestDto: UpdateRequestDto) {
    const docRef = this.col().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null as any;
    await docRef.update(updateRequestDto as Partial<RequestEntity>);
    const merged = {
      ...(doc.data() as RequestEntity),
      ...updateRequestDto,
    } as RequestEntity;
    return merged;
  }

  async remove(id: string) {
    const docRef = this.col().doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }
}
