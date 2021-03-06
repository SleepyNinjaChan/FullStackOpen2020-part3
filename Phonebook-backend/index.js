require("dotenv").config()
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const Person = require("./models/person")

const app = express()

app.use(express.static("build"))
app.use(cors())
app.use(express.json())
morgan.token("data", (request) => JSON.stringify(request.body))
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :data"))

app.get("/", (request, response) => {
	response.send("<h1>Hello World!</h1>")
})

app.get("/info", (request, response, next) => {
	Person.find({})
		.then((persons) => {
			response.send("<div>"
				+ `<p>Phonebook has info for ${persons.length} people<p/>`
				+ `<p> ${new Date()}</p>`
				+ "</div>")
		})
		.catch((error) => next(error))
})

app.get("/api/persons", (request, response, next) => {
	Person.find({})
		.then((persons) => {
			response.json(persons.map((person) => person.toJSON()))
		})
		.catch((error) => next(error))
})

app.get("/api/persons/:id", (request, response, next) => {
	Person.findById(request.params.id)
		.then((person) => {
			if (person) {
				response.json(person.toJSON())
			} else {
				response.status(404).end()
			}
		})
		.catch((error) => next(error))
})

app.post("/api/persons", async (request, response, next) => {
	const { body } = request

	const person = new Person({
		name: body.name,
		number: body.number,
	})

	person.save()
		.then((savedPerson) => savedPerson.toJSON())
		.then((formattedPerson) => {
			response.json(formattedPerson)
		})
		.catch((error) => next(error))
})

app.put("/api/persons/:id", (request, response, next) => {
	const { body } = request

	const person = ({
		name: body.name,
		number: body.number,
	})

	Person.findByIdAndUpdate(request.params.id, person, { runValidators: true, context: "query", new: true })
		.then((updatedPerson) => {
			if (updatedPerson) {
				response.json(updatedPerson.toJSON())
			} else {
				response.status(404).json({ error: `${person.name} has already been deleted` })
			}
		})
		.catch((error) => next(error))
})

app.delete("/api/persons/:id", (request, response, next) => {
	Person.findByIdAndRemove(request.params.id)
		.then(() => {
			response.status(200).end()
		})
		.catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
	response.status(404).send({ error: "unknown endpoint" })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
	console.error(error.message)
	if (error.name === "CastError" && error.path === "_id") {
		return response.status(400).send({ error: "malformatted id" })
	}
	if (error.name === "ValidationError") {
		console.log(error)
		if (error.errors.name) {
			if (error.errors.name.kind === "minlength") {
				return response.status(400).json({ error: "Name is too short" })
			} if (error.errors.name.kind === "required") {
				return response.status(400).json({ error: "Name is required" })
			} if (error.errors.name.kind === "unique") {
				return response.status(400).json({ error: "Name must be unique" })
			}
		} else if (error.errors.number) {
			if (error.errors.number.kind === "minlength") {
				return response.status(400).json({ error: "Number is too short" })
			} if (error.errors.number.kind === "required") {
				return response.status(400).json({ error: "Number is required" })
			}
		} else {
			return response.status(400).json({ error: error.message })
		}
	}
	next(error)
	return response.status(500).end()
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})
