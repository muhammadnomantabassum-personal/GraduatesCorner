import assert from 'node:assert/strict'
import { typescriptLoader } from './employer-test-loader.mjs'
const {parseDiscoveryQuery,serializeDiscoveryQuery}=typescriptLoader()('lib/discovery.ts')
const state=parseDiscoveryQuery('?q=machine+learning&kind=internship&location=Sweden&location=Germany&sort=deadline&view=list')
assert.equal(state.search,'machine learning')
assert.equal(state.filters.kind[0],'internship')
assert.equal(state.filters.location.length,2)
assert.equal(JSON.stringify(parseDiscoveryQuery(serializeDiscoveryQuery(state))),JSON.stringify(state))
assert.equal(parseDiscoveryQuery('?location=&sort=unknown&view=unknown').filters.location.length,0)
assert.equal(parseDiscoveryQuery('?sort=unknown').sort,'newest')
assert.equal(parseDiscoveryQuery('?q='+'a'.repeat(300)).search.length,200)
console.log('PASS discovery URL round-trip, combined filters, empty values and safe defaults')
