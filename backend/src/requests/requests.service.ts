/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { OffersService } from '../offers/offers.service';
import { Request, RequestDocument } from '../schemas/request.schema';

type RequestEntity = CreateRequestDto & {
  id: string;
  createdAt: number;
  status: 'open' | 'assigned' | 'closed';
};

@Injectable()
export class RequestsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly offersService: OffersService,
    @InjectModel(Request.name)
    private requestModel: Model<RequestDocument>,
  ) {}

  async create(createRequestDto: CreateRequestDto) {
    const id = `req_${Date.now()}`;
    const entity: RequestEntity = {
      id,
      createdAt: Date.now(),
      status: 'open',
      ...createRequestDto,
    };
    
    // MongoDB-ში შექმნა
    const createdRequest = new this.requestModel(entity);
    await createdRequest.save();
    return createdRequest.toObject();
  }

  async findAll() {
    const requests = await this.requestModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    // Add offers count for each request
    const requestsWithOffersCount = await Promise.all(
      requests.map(async (request) => {
        const offers = await this.offersService.findAll(request.id);
        return {
          ...request.toObject(),
          offersCount: offers.length,
        };
      }),
    );

    return requestsWithOffersCount;
  }

  async findOne(id: string) {
    return await this.requestModel.findOne({ id }).exec();
  }

  async update(id: string, updateRequestDto: UpdateRequestDto) {
    const updateData = {
      ...updateRequestDto,
      updatedAt: Date.now(),
    };

    return await this.requestModel
      .findOneAndUpdate({ id }, updateData, { new: true })
      .exec();
  }

  async remove(id: string) {
    const result = await this.requestModel.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }
}
