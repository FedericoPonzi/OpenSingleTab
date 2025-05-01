import { useState } from "react"
import "./style.css"

function OptionsIndex() {
    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">
                OpenSingleTab Options
            </h1>
            <h2 className="text-xl font-semibold mb-2">You have found the Option UI page.</h2>
            <p className="mb-4 text-gray-700">At the moment there are no options to set. Please come back later.</p>
            <a 
                href={`tabs/display.html`}
                className="text-blue-600 hover:text-blue-800 underline"
            >
                Display One tab
            </a>
        </div>
    )
}

export default OptionsIndex;