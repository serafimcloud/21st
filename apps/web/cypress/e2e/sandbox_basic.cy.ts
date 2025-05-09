describe("Home Page Portal Interaction", () => {
  it("should open the portal after clicking Browse Component and restrict interaction to the portal", () => {
    cy.visit("http://localhost:3000/")
    cy.contains(/browse component/i).click()
    cy.get("[data-portal]").should("be.visible")
    cy.get("body").then(($body) => {
      if ($body.find("[data-portal]").length) {
        cy.get("[data-portal]").should("be.visible")
        cy.get("main, header, footer").should(
          "have.css",
          "pointer-events",
          "none",
        )
      }
    })
  })
})

describe("Studio Page Basic Load", () => {
  it("should load the studio page for serjobasDEV", () => {
    cy.visit("http://localhost:3000/studio/serjobasDEV")
    cy.contains("serjobasDEV").should("be.visible")
  })
})
