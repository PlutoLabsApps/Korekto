export default defineNuxtRouteMiddleware((to) => {
  const { user } = useUserSession()
  if (to.meta.role && user.value?.role !== to.meta.role) {
    return navigateTo('/dashboard')
  }
})
