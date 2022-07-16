const { AuthenticationError } = require('apollo-server-express');

const { User } = require('../models/User');
// const { Book } = require('../models/Book');

const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
         
         me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({})
                .select('-__v -password')
                .populate('books')
            
                return userData;
            }

            throw new AuthenticationError('You are not logged in')
        },

    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
          
            return {token, user};
        },
        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});

            if(!user) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }
            const token = signToken(user);
            return {token, user};
    
        },
        saveBook: async (parent, args, context) => {
            if (context.user) {
            // const savedBook = await Book.create({ ...args, username: context.user.username });
          
            // update user saved books
             const updatedUser =  await User.findByIdAndUpdate(
                { _id: context.user._id },
                // use addToSet instead of push to add the book value 
                // if it does not exist -- $push would duplicate book saves
                { $addToSet: { savedBooks: args.input } },
                { new: true }
              );
          
            return updatedUser;
            }
          
            throw new AuthenticationError('You must be logged in!');
        },
        // remove a saved book from user library
        removeBook: async (parent, args, context) => {
            if(context.user) {
            const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $pull: { savedBooks: { bookId: args.bookId } } },
                { new: true }
            );

            return updatedUser;
            }

            throw new AuthenticationError('You must be logged in!');
        }
    }
};

module.exports = resolvers;