import {Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver, UseMiddleware} from "type-graphql"
import {User} from "./entity/User";
import {compare, hash} from "bcryptjs"
import {sign} from "jsonwebtoken";
import {MyContext} from "./MyContext";
import {isAuth} from "./middleware/isAuth";


// Кастомный тип
@ObjectType()
class LoginResponse {
    @Field()
    accessToken: string
}


@Resolver()
export class UserResolver {

    @Query(() => String)
    hello() {
        return "hi!";
    }


    // Проверка авторизации и доступа к запросу!
    @Query(()=> String)
    @UseMiddleware(isAuth)
    bye(@Ctx() {payload} : MyContext){
        console.log(payload)
        return `your user id is: ${payload!.userId}`;
    }

    @Query(() => [User])
    users() {
        return User.find();
    }


    @Mutation(() => LoginResponse)
    async login(
        @Arg('email') email: string,
        @Arg('password') password: string,
        @Ctx() {res}: MyContext
    ): Promise<LoginResponse> {

        const user = await User.findOne({where: {email}})

        if (!user)
            throw new Error("Could not find user")

        const passCompare = await compare(password, user.password) // проверка хэша и пароля

        if (!passCompare)
            throw new Error("Password don't match")

        // login success
        res.cookie("jid", sign({userId: user.id}, process.env.REFRESH_TOKEN_SECRET!, {expiresIn: "7d"}), {
            httpOnly: true
        })

        return {
            accessToken: sign({userId: user.id}, process.env.ACCESS_TOKEN_SECRET!, {expiresIn: "15m"})
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