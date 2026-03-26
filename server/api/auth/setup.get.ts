import { authService } from '../../services/auth'

export default defineEventHandler(() => {
  return { success: true, data: { isSetup: !authService.isSetupRequired() } }
})
