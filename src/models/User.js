import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
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

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(String(password || ''), this.password);
};

UserSchema.statics.hashPassword = function (password) {
  const saltRounds = 12;
  return bcrypt.hash(String(password || ''), saltRounds);
};

const User = mongoose.model('User', UserSchema);

export default User;
