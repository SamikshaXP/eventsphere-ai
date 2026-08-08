import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [150, 'Organization name cannot exceed 150 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    logo: {
      type: String,
      default: ''
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organization owner is required'],
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
