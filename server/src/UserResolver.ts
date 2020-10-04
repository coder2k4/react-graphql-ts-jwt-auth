import {Arg, Field, Mutation, ObjectType, Query, Resolver} from "type-graphql"
import {User} from "./entity/User";
import {compare, hash} from "bcryptjs"
import {sign} from "jsonwebtoken";




// Кастомный тип
@ObjectType()
class LoginResponse {
    @Field()
    accessToken : string
}


@Resolver()
export class UserResolver {

    @Query(() => String)
    hello() {
        return "hi!";
    }

    @Query(() => [User])
    users() {
        return User.find();
    }


    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string
    ): Promise<LoginResponse> {

        const user = await User.findOne({where: {email}})

        if (!user)
            throw new Error("Could not find user")

        const passCompare = await compare(password, user.password) // проверка хэша и пароля

        if (!passCompare)
            throw new Error("Password don't match")

        // login success

        return {
            accessToken: sign({userId: user.id}, "somesupersecretstring", {expiresIn: "15m"})
        }
    }


    @Mutation(() => Boolean)
    async register(
        @Arg('email') email: string,
        @Arg('password') password: string
    ) {

        const hashedPassword = await hash(password, 12)

        try {
            await User.insert({
                email,
                password: hashedPassword
            })
        } catch (err) {
            console.log(err)
            return false
        }


        return true
    }
}