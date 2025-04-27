import { useState } from "react"

function OptionsIndex() {
    return (
        <div>
            <h1>
                OpenSingleTab Options
            </h1>
            <h2>You have found the Option UI page.</h2>
            <p>At the moment there are no options to set. Please come back later.</p>
            <a href={`tabs/display.html`}>Display One tab</a>
        </div>
    )
}

export default OptionsIndex;