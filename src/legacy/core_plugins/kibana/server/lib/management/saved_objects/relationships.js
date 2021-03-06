/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export async function findRelationships(type, id, options = {}) {
  const {
    size,
    savedObjectsClient,
    savedObjectTypes,
  } = options;

  const { references = [] } = await savedObjectsClient.get(type, id);

  // we filter the objects which we execute bulk requests for based on the saved
  // object types as well, these are the only types we should be concerned with
  const bulkGetOpts = references
    .filter(({ type }) => savedObjectTypes.includes(type))
    .map(ref => ({ id: ref.id, type: ref.type }));

  const [referencedObjects, referencedResponse] = await Promise.all([
    bulkGetOpts.length > 0
      ? savedObjectsClient.bulkGet(bulkGetOpts)
      : Promise.resolve({ saved_objects: [] }),
    savedObjectsClient.find({
      hasReference: { type, id },
      perPage: size,
      fields: ['title'],
      type: savedObjectTypes,
    }),
  ]);

  const relationshipObjects = [].concat(
    referencedObjects.saved_objects.map(extractCommonProperties),
    referencedResponse.saved_objects.map(extractCommonProperties),
  );

  return relationshipObjects.reduce((result, relationshipObject) => {
    const objectsForType = (result[relationshipObject.type] || []);
    const { type, ...relationshipObjectWithoutType } = relationshipObject;
    result[type] = objectsForType.concat(relationshipObjectWithoutType);
    return result;
  }, {});
}

function extractCommonProperties(savedObject) {
  return {
    id: savedObject.id,
    type: savedObject.type,
    title: savedObject.attributes.title,
  };
}
