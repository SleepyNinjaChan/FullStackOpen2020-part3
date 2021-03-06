const mongoose = require("mongoose")

if (process.argv.length < 3) {
	console.log("give password as argument")
	process.exit(1)
}

const password = process.argv[2]
const name = process.argv[3]
const number = process.argv[4]
const url = `mongodb+srv://ninja:${password}@fullstack-pru4c.azure.mongodb.net/phonebook?retryWrites=true&w=majority`

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })

const personSchema = new mongoose.Schema({
	name: String,
	number: String,
	id: Number,
})

const Person = mongoose.model("Person", personSchema)

const person = new Person({
	name,
	number,
})


if (process.argv.length === 3) {
	console.log("phonebook:")
	Person.find({}).then((result) => {
		result.forEach((p) => {
			console.log(`${p.name} ${p.number}`)
		})
		mongoose.connection.close()
	})
} else if (process.argv.length > 3) {
	person.save().then(() => {
		console.log(`added ${name} number ${number} to phonebook`)
		mongoose.connection.close()
	})
}
