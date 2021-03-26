// 绝大多数常用依赖，不要放到编译链中，为了演示意图，我们用 cjs 风格导入
_ = require('lodash')

CTX = {
  // 我们用 meteor 技术，所以数据围绕着一个智能的数据集合
  collections: {
    todos: new Mongo.Collection('todos', { connection: null }), // 我们这里不需要存数据库，链接设置空
  },
  state: new ReactiveDict(),
}

// 如果命名碰撞少，省掉 window. var const let 让我们做一个 alias，节省超长的 typing
Todos = CTX?.collections?.todos

// 我们给 Todos 造一些 reactive helper

Todos.List = function () {
  return Todos.find({ parentId: { $exists: false } })
}

Todos.ChildrenList = function (parentId) {
  return Todos.find({ parentId })
}

// 我们做一个简单的抽象，这里是所有的用户交互、事件交互等动作
Meteor.Actions = function (actions) {
  const methods = {}

  _.each(actions, function (action, actionName) {
    if (_.isFunction(action)) {
      methods[actionName] = action
    } else {

    }
  })

  Meteor.methods(methods)
}

Meteor.Actions({
  'todosAdd' (text) {
    Todos.insert({ text, isCompleted: false, isDisabled: false })
  },
  'todosAddToParent' (parentId, text) {
    Todos.insert({ parentId, text, isCompleted: false, isDisabled: false })
  },
  'todosToggleComplete' (_id, isCompleted) {
    Todos.update(_id, { $set: { isCompleted: !isCompleted } })
  },
  'todosToggleDisable' (_id, isDisabled) {
    Todos.update(_id, { $set: { isDisabled: !isDisabled } })
  },
  'todosRemove' (_id) {
    Todos.remove({ $or: [{ _id }, { parentId: _id }] })
  },
  'todosFilterAll': {},
  'todosFilterCompleted': { isCompleted: true },
  'todosFilterDisabled': { isDisabled: true },
})

module.exports = CTX
