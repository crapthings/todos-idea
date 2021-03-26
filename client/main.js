import React, { PureComponent, useState, useEffect } from 'react'
import { render } from 'react-dom'

import '/both'

function App () {
  return (
    <>
      <Toolbar />
      <TodoForm />
      <TodosList />
    </>
  )
}

function Toolbar () {
  return (
    <Reactor>
      {() => (
        <div>
          <button onClick={() => Meteor.call('todosFilterAll')}>显示所有</button>
          <button onClick={() => Meteor.call('todosFilterCompleted')}>显示已完成</button>
          <button onClick={() => Meteor.call('todosFilterDisabled')}>显示已关闭</button>
        </div>
      )}
    </Reactor>
  )
}

function TodoForm ({ parentId }) {
  const submit = (text) => {
    parentId
      ? Meteor.call('todosAddToParent', parentId, text)
      : Meteor.call('todosAdd', text)
  }

  return (
    <form onSubmit={(evt) => {
      evt.preventDefault()
      submit(evt?.target[0]?.value || Random.id())
    }}>
      <input
        type='text'
        onKeyUp={(evt) => {
          if (evt.code !== 'Enter') return
          submit(evt?.target[0]?.value || Random.id())
        }}
      />
      <input type='submit' value='提交' className='mrg' />
      {parentId && <span>这个内容将插入 {parentId}</span>}
    </form>
  )
}

function TodosList () {
  return (
    <Reactor data={Todos.List()}>
      {({ data: todos }) => (
        <div>
          <h3>Todos List</h3>
          {todos?.map(TodosItem)}
        </div>
      )}
    </Reactor>
  )
}

function TodosChildrenList ({ parentId }) {
  return (
    <Reactor data={Todos.ChildrenList(parentId)}>
      {({ data: todos }) => (
        <>
          {todos?.map(TodosItem)}
        </>
      )}
    </Reactor>
  )
}

function TodosItem (todo) {
  console.log('before LocalReactor', todo._id)
  return (
    <LocalReactor key={todo._id} state={{ openTodoForm: false }} {...todo}>
      {({ state, setState, _id, text, isCompleted, isDisabled }) => (
        <div>
          <span className={`${isCompleted ? 'green' : ''} ${isDisabled ? 'strike' : ''}`}>{text}</span>
          {!isDisabled && <label className='mgr' onClick={() => Meteor.call('todosToggleComplete', _id, isCompleted)}>
            <input type='checkbox' defaultChecked={isCompleted} />
            <span>完成</span>
          </label>}

          {!isCompleted && <label className='mgr' onClick={() => Meteor.call('todosToggleDisable', _id, isDisabled)}>
            <input type='checkbox' defaultChecked={isDisabled} />
            <span>关闭</span>
          </label>}

          {(!isCompleted && !isDisabled) && <label className='mgr' onClick={() => Meteor.call('todosRemove', _id)}>
            <span>删除</span>
          </label>}

          <label className='mgr' onClick={() => {
            setState({ openTodoForm: !state.openTodoForm })
          }}>
            <span>子任务</span>
          </label>

          {state.openTodoForm && (
            <>
              <TodoForm parentId={todo._id} />
              <TodosChildrenList parentId={todo._id} />
            </>
          )}
          {console.log('inside LocalReactor', todo._id)}
        </div>
      )}
    </LocalReactor>
  )
}

function Reactor ({ data, children }) {
  const [state, setState] = useState()

  useEffect(() => {
    const trackerHandler = Tracker.autorun((computation) => {
      setState(data?.fetch())
      return computation
    })

    return () => {
      trackerHandler?.stop()
    }
  }, [])

  return children({ data: state })
}

class LocalReactor extends PureComponent {
  state = this.props.state || {}
  render () {
    return this.props.children({
      ...this.props,
      state: this.state,
      setState: this.setState.bind(this),
    })
  }
}

Meteor.startup(function () {
  render(<App />, document.getElementById('app'))
})
