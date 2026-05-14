import { FundIsland } from '@/components/FundIsland'
import { useFundRefresh } from '@/hooks/useFundRefresh'

export default function App() {
  useFundRefresh()

  return <FundIsland />
}
