import { Link } from 'react-router-dom'
import { usePageTitle } from '../lib/hooks'

export default function NotFoundPage() {
  usePageTitle('ページが見つかりません')
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-6xl mb-4" aria-hidden="true">🧯</p>
      <h1 className="text-2xl font-black text-ink-900 mb-2">ページが見つかりません</h1>
      <p className="text-slate-500 mb-8">URLが正しいか確認してください。</p>
      <Link to="/" className="inline-block bg-fire-600 hover:bg-fire-500 text-white font-bold px-6 py-3 rounded-xl">
        トップへ戻る
      </Link>
    </div>
  )
}
