import { app, router, store } from './app'

const isDev = process.env.NODE_ENV !== 'production'

// 这个暴露的方法将被 bundleRenderer 调用
// 这里我们将在实际渲染前获取到决定我们应用中 Store 的数据
// 因为数据是异步获取，这个方法会返回一个 Promise 给应用实例
export default context => {
  const s = isDev && Date.now()

  // 设置路由位置
  router.push(context.url)
  const matchedComponents = router.getMatchedComponents()

  // 无匹配路由
  if (!matchedComponents.length) {
    return Promise.reject({ code: '404' })
  }

  // 调用匹配路由组件的 preFetch 钩子
  // 一个 preFetch 钩子分发一个 action，并返回一个 Promise
  // 该 Promise 将在 action 完成和 state 变更时 resolve
  return Promise.all(matchedComponents.map(component => {
    if (component.preFetch) {
      return component.preFetch(store)
    }
  })).then(() => {
    isDev && console.log(`data pre-fetch: ${Date.now() - s}ms`)
    // 在所有的 preFetch 钩子 resolved 后
    // 我们的 store 现在有了用于渲染应用的所有 state
    // 将这些 state 暴露给 context，并请求处理内联在 HTML 响应中的 state
    // 这允许客户端 store 拿到服务器端的 state，而无需再去获取初始数据
    context.initialState = store.state
    return app
  })
}
