import fastify from "fastify"
import { usersRoutes } from "./routes/users"
import fastifyCookie from '@fastify/cookie'
import { mealRoutes } from "./routes/meals"


export const app = fastify()

app.register(fastifyCookie)
app.register(mealRoutes)
app.register(usersRoutes)


app.listen({ port: 3333 }, () => {
  console.log('App running at port 3333')
})