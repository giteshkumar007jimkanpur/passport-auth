import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false /** Made optional for OAuth users */,
      select: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/** Unique contraint */
/** index collation -> Abc@email.com and abc@email.com won't have distinct document */
UserSchema.index(
  { email: 1 },
  { collation: { locale: 'en', strength: 2 }, unique: true },
);

/** Unique contraint on googleId when present */
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
/** sparse-  allow null but uniqueness when avaialable */

/** Instance method to compare password */
UserSchema.methods.comparePassword = function (password) {
  if (!password) {
    return false;
  } /** OAuth users don't have password */
  return bcrypt.compare(String(password || ''), this.passwordHash);
};

/** Static method to hash password */
UserSchema.statics.hashPassword = function (password) {
  if (!password) {
    return null;
  } /** OAuth users don't have password */
  const saltRounds = 12;
  return bcrypt.hash(String(password || ''), saltRounds);
};

const User = mongoose.model('User', UserSchema);

export default User;
