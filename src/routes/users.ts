import { z } from "zod";
import { app } from "../server";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-exists-sessionid";

interface IMeal {
  id: string;
  dish: string;
  description: string;
  date_time: string;
  user_id: string;
  diet: "isDiet" | "isNotDiet";
}

const MAX_FILE_SIZE = 500000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

function longestSequenceDays(listMealsDiet: IMeal[]) {
  listMealsDiet.sort((a, b) => {
    if (a.date_time > b.date_time) {
      return 1;
    } else {
      return -1;
    }
  }); // ordena o array em ordem crescente
  let actuallySequence = 1;
  let longestSequence = 1;
  for (let i = 1; i < listMealsDiet.length; i++) {
    const diff =
      (new Date(listMealsDiet[i].date_time).getTime() -
        new Date(listMealsDiet[i - 1].date_time).getTime()) /
      (1000 * 60 * 60 * 24); // diferença em dias
    if (diff === 1) {
      actuallySequence++;
    } else {
      longestSequence = Math.max(longestSequence, actuallySequence);
      actuallySequence = 1;
    }
  }
  longestSequence = Math.max(longestSequence, actuallySequence);
  return longestSequence;
}

export async function usersRoutes() {
  // app.addHook('preHandler', checkSessionIdExists)

  app.post("/users", async (req, rep) => {
    const dataUsersBodySchema = z.object({
      // photoUser: z
      //   .any()
      //   .refine(
      //     (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      //     `Max image size is 5MB.`
      //   )
      //   .refine(
      //     (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      //     "Only .jpg, .jpeg, .png and .webp formats are supported."
      //   ),
      name: z.string(),
      age: z
        .number()
        .min(
          14,
          "Você não tem idade suficiente para utilizar o aplicativo sozinho"
        )
        .nullable(),
    });

    const { name, age } = dataUsersBodySchema.parse(req.body);

    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      rep.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    const user = await knex("users")
      .insert({ id: randomUUID(), name, age, session_id: sessionId })
      .returning("*");

    return rep.status(201).send({ user });
  });

  app.get("/users/:name", async (req, rep) => {
    const NameUserParamsSchema = z.object({
      name: z.string(),
    });

    const { name } = NameUserParamsSchema.parse(req.params);

    const user = await knex("users").where("name", "like", `%${name}%`).first();

    if (!user) {
      throw new Error("You must be create a user");
    }

    let { sessionId } = req.cookies;

    if (!sessionId) {
      sessionId = randomUUID();

      rep.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }
    return rep.status(201).send(user);
  });

  app.get("/users/:userId/metrics", async (req, rep) => {
    const userIdParamsSearch = z.object({
      userId: z.string().uuid(),
    });

    const { userId } = userIdParamsSearch.parse(req.params);

    const listMealsByUser = await knex("meals").where({ user_id: userId });

    const response: {
      allMeals: number;
      amountDiet: Array<IMeal>;
      amountNotDiet: Array<IMeal>;
    } = listMealsByUser.reduce(
      (acc, meal: IMeal) => {
        if (meal.diet === "isDiet") {
          acc.allMeals += 1;
          acc.amountDiet.push(meal);

          return acc;
        } else if (meal.diet === "isNotDiet") {
          acc.allMeals += 1;
          acc.amountNotDiet.push(meal);

          return acc;
        }
      },
      {
        allMeals: 0,
        amountDiet: [],
        amountNotDiet: [],
      }
    );

    const sequenceDaysInDiet = longestSequenceDays(response.amountDiet)

    const result = {
      amountDiet: response.amountDiet.length,
      amountNotDiet: response.amountNotDiet.length,
      allMeals: response.allMeals,
      sequenceDaysInDiet
    };

    console.log(result)

    return rep.status(200).send(result)
  });
}
