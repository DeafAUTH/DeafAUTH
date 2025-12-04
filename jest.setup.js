// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for jsdom environment
import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill crypto for Web Crypto API
const { webcrypto } = require('crypto')
global.crypto = webcrypto
