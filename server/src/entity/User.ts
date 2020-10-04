import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";
import {Field, ObjectType} from "type-graphql";

@ObjectType()
@Entity("users")
export class User extends BaseEntity{

    @Field()
    @PrimaryGeneratedColumn()
    id: number;

    @Field()
    @Column('text')
    email: string;

    @Field()
    @Column('text')
    password: string;

}
