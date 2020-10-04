// Graphql schemas
import {Query, Resolver} from "type-graphql"

@Resolver()
export class UserResolver {
    @Query(() => String)
    hello() {
        return "hi!";
    }
}