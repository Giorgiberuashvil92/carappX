export class CreateRequestDto {
  partName: string;
  partDescription?: string;
  partBrand?: string;
  budget?: number;
  urgency?: string;
  notes?: string;
  vehicle?: {
    make?: string;
    model?: string;
    year?: string;
    yearRange?: { from?: string; to?: string };
    vin?: string;
  };
}
