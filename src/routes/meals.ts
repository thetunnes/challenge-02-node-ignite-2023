import { FastifyInstance } from "fastify";
import { z } from "zod"
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-exists-sessionid";
import { randomUUID } from "node:crypto";

export async function mealRoutes(app: FastifyInstance) {
  app.addHook('preHandler', checkSessionIdExists)

  app.post("/meals", async (req, rep) => {
    const MealBodySchema = z.object({
      dish: z.string(),
      description: z.string(),
      dateTime: z.string(),
      userId: z.string(),
      isDiet: z
        .string()
        .refine(
          (textDiet) => textDiet === "isDiet" || textDiet === "isNotDiet",
          "Type meal diet is not valid"
        ),
    });

    const {
      dish,
      description,
      dateTime,
      isDiet: diet,
      userId
    } = MealBodySchema.parse(req.body);

    const newMeal = await knex("meals")
      .insert({ id: randomUUID(), dish, description, date_time: dateTime, diet, user_id: userId })
      .returning("*")

      console.log(newMeal)

      return rep.status(201).send(newMeal)
  });

  app.patch("/meals/:userId", async (req, rep) => {
    // Todos os campos são obrigatórios, se a ideia não for alterar todos, deve ser enviado os dados que já
    // existiam.
    const MealBodySchema = z.object({
      mealId: z.string(),
      dish: z.string(),
      description: z.string(),
      dateTime: z.string(),
      isDiet: z
        .string()
        .refine(
          (textDiet) => textDiet === "isDiet" || textDiet === "isNotDiet",
          "Type meal diet is not valid"
        ),
    });
    const MealParamsSchema = z.object({
      userId: z.string().uuid()
    })

    const { mealId, dish, description, dateTime, isDiet } = MealBodySchema.parse(req.body)
    const { userId } = MealParamsSchema.parse(req.params)

    await knex("meals").where({'id': mealId, user_id: userId}).update({
      dish,
      description,
      date_time: dateTime,
      diet: isDiet
    })
  });

  app.delete("/meals/:userId/:mealId", async (req, rep) => {
    const MealIdParamsSchema = z.object({
      mealId: z.string(),
      userId: z.string()
    })

    const { mealId, userId } = MealIdParamsSchema.parse(req.params)

    await knex("meals").delete().where({'id': mealId, 'user_id': userId})

    return rep.status(204).send()
  })

  app.get("/meals/:userId", async (req, rep) => {

    const UserIdParamsSchema = z.object({
      userId: z.string()
    })

    const { userId } = UserIdParamsSchema.parse(req.params)


    const listMeals = await knex("meals").where('user_id', userId)

    return rep.status(200).send({meals: listMeals})
  })

  app.get("/meal/:mealId", async (req, rep) => {

    const MealIdParamsSchema = z.object({
      mealId: z.string()
    })

    const { mealId } = MealIdParamsSchema.parse(req.params)


    const listMeals = await knex("meals").where('id', mealId)

    return rep.status(200).send(listMeals[0])

  })
}