const { gql } = require('graphql-request')

const queries = {

  login: gql`
    mutation login($username: String!, $password: String!) {
      login(emailOrUsername: $username, password: $password) {
        token
      }
    }`,

  getIntentsSize: gql`
    query {
      intentsPages(limit:1){
        totalCount
      }
    }`,

  getIntent: gql`
    query getIntent($intent_id: ID!){
      intent(id: $intent_id){
        provider{
          id
          name
        }
        availableQuantity{
          hasUnit{
            id
          }
          hasNumericalValue
        }
      }
    }`,

  getIntents: gql`
    query getIntents($receiver_id: ID!, $num: Int) {
      intents(filter: {receiver: $receiver_id}, start: 0, limit: $num){
        id,
        provider{
          id,
          name
        },
        availableQuantity {
          hasNumericalValue
          hasUnit {
            label
            symbol
          }
        },
        resourceInventoriedAs{
          id
          name
          note
          onhandQuantity{
            hasNumericalValue
            hasUnit{
              label
              symbol
            }
          }
        }
        note,
        satisfiedBy{
          id
        }
      }
    }`,

  finishIntent: gql`
    mutation finishIntent($intent_id: ID!){
      updateIntent(intent:{id: $intent_id, finished:true}){
        intent{
          id
          finished
        }
      }
    }`,

  recordActionNewResource: gql`
    mutation recordAction($action: ID!, $provider_id: ID!, $receiver_id: ID!, $quantity: IMeasure!, $product_name: String!, $tags: ID, $notes: String) {
      createEconomicEvent(
      event: {
        action: $action,
        provider: $provider_id,
        receiver: $receiver_id,
        resourceQuantity: $quantity
      },
      newInventoriedResource: {
        name: $product_name,
        note: $notes,
        tags: [$tags]
      }
      ) {
        economicEvent {
          id
          note
          resourceInventoriedAs {
            id
            name
            onhandQuantity {
              hasNumericalValue
              hasUnit {
                label
                symbol
              }
            }
            accountingQuantity {
              hasNumericalValue
              hasUnit {
                label
                symbol
              }
            }
          }
        }
      }
    }`,

  recordAction: gql`
    mutation recordAction($action: ID!, $provider_id: ID!, $receiver_id: ID, $quantity: IMeasure, $resource_id: ID!) {
      createEconomicEvent(
        event: {
          action: $action,
          provider: $provider_id,
          receiver: $receiver_id, 
          resourceQuantity: $quantity,
          resourceInventoriedAs: $resource_id
        }
      ) {
        economicEvent {
          id
          note
          resourceInventoriedAs {
            id
            name
            onhandQuantity {
              hasNumericalValue
              hasUnit {
                label
                symbol
              }
            }
            accountingQuantity {
              hasNumericalValue
              hasUnit {
                label
                symbol
              }
            }
          }
        }
      }
    }`,

  recordOffer: gql`
    mutation recordOffer($receiver_id: ID!, $resource_id: ID!, $quantity: IMeasure){
      createOffer(intent: {
        action: "transfer",
        name: "Donazione",
        receiver: $receiver_id,
        resourceInventoriedAs: $resource_id,
        availableQuantity: $quantity
      }
      ) {
        intent {
          id
          name
          note
          provider {
            name
          }
          receiver {
           name
          }
          availableQuantity {
            hasUnit {
              label
            }
            hasNumericalValue
          }
          resourceInventoriedAs{
            id
            name
          }
        }
      }
    }`,

  getFilteredInventory: gql`
    query getFilteredInventory($agent: ID!, $tag: ID!){
      economicResourcesFiltered(agent: $agent, tagIds: $tag){
        id,
        name
        note,
        onhandQuantity{
          id
          hasUnit{
            id
            symbol
          }
          hasNumericalValue
        }
      }
    }`,

  createCommitment: gql`
    mutation createCommitment($provider_id: ID!, $receiver_id: ID!){
      createCommitment(
        commitment:{
          action:"transfer"
          provider: $provider_id,
          receiver: $receiver_id,
      }){
        commitment{
          id
          action{
            label
          }
          provider{
            id
            name
          }
          receiver{
            id
            name
          }
        }
      }
    }`,

  createSatisfaction: gql`
    mutation createSatisfaction($intent_id: ID!, $commitment_id: ID!, $quantity: IMeasure){
      createSatisfaction(
        satisfaction: {
          satisfies: $intent_id,
          satisfiedBy: $commitment_id,
          resourceQuantity: $quantity
        }){
        satisfaction{
          id
          satisfiedBy{
            __typename
            ... on Commitment{
              resourceQuantity{
                hasNumericalValue
              }
            }
          }
          satisfies{
            id
          }
        }
      }
    }`,

  getSatisfactions: gql`
    query{
      satisfactions(limit:500){
        id
        resourceQuantity {
          hasUnit {
            id
            symbol
          }
          hasNumericalValue
        }
        satisfiedBy {
          __typename
          ... on Commitment {
            receiver {
              id
              name
            }
            provider{
              id
              name
            }
          }
        }
        satisfies {
          resourceInventoriedAs {
            name
          }
          finished
        }
      }
    }`,

  getSatisfaction: gql`
    query getSatisfaction($s_id: ID!){
      satisfaction(id: $s_id){
        id
        resourceQuantity {
          hasUnit {
            id
            symbol
          }
          hasNumericalValue
        }
        satisfiedBy {
          __typename
          ... on Commitment {
            receiver {
              id
              name
            }
            provider{
              id
              name
            }
          }
        }
        satisfies {
          id
          resourceInventoriedAs {
            id
            name
          }
          finished
        }
      }
    }`,

  filterSatisfactions: function (data, receiver, finished) {
    return data.filter(function (el) {
     return el.satisfiedBy.receiver.id == receiver &&
         el.satisfies.finished == finished;
      });
  }
}

module.exports = queries
