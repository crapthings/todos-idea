import '/both'

Meteor.publish(null, function () {
  return Todos.find()
})
