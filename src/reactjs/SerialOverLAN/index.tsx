/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/

import React from 'react'
import { createRoot } from 'react-dom/client'
import i18n from '../../i18n'
import { Sol } from './Sol'
// Get browser language
i18n.changeLanguage(navigator.language).catch(() => { console.info('error occured') })

const url = new URL(window.location.href)
const params = new URLSearchParams(url.search)

const rootElement = document.getElementById('sol')
if (rootElement != null) {
  const root = createRoot(rootElement)
  root.render(<Sol deviceId={params.get('deviceId')} authToken="authToken" mpsServer={params.get('mpsServer')} />)
}
