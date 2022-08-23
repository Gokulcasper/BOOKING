# Database and REST (dare)

[![Coverage Status](https://coveralls.io/repos/github/5app/dare/badge.svg)](https://coveralls.io/github/5app/dare)
[![CircleCI](https://circleci.com/gh/5app/dare.svg?style=shield)](https://circleci.com/gh/5app/dare)
[![NPM Version](https://img.shields.io/npm/v/dare.svg)](https://www.npmjs.com/package/dare)
[![Known Vulnerabilities](https://snyk.io/test/github/5app/dare/badge.svg)](https://snyk.io/test/github/5app/dare)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![codebeat badge](https://codebeat.co/badges/718b30e2-76fa-4c61-b770-751b22c5ea5e)](https://codebeat.co/projects/github-com-5app-dare-main)



Dare is a lovely API for generating SQL out of structured Javascript object. It's more than just sugar to querying a SQL database though, as you will discover.
# Example usage...

This is a simple setup to get started with, it'll make a basic SELECT query.

```js
// Require the module
import Dare from 'dare';
import sqlConn from './mySqlConn.js';

// Initiate it
const dare = new Dare();

// Define the handler dare.execute for handing database requests
await dare.execute = async ({sql, values}) => {
	// Execute query using prepared statements
	return sqlConn.execute(sql, values);
};

// Make a request
const resp = await dare.get('users', ['name'], {id: 1});
// SELECT id, name FROM users WHERE id = 1 LIMIT 1;

console.log(`Hi ${resp.name}');
```

## Install

```bash
npm i dare --save
```

# Methods

## dare.get(table[, fields][, filter][, options])

The `dare.get` method is used to build and execute a `SELECT ...` SQL statement.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to access
| fields   | Array strings     | Fields Array
| filter   | Hash (key=>Value) | Query Object
| options  | Hash (key=>Value) | Additional Options

e.g.

```js
await dare.get('table', ['name'], {id: 1});
// SELECT name FROM table WHERE id = 1 LIMIT 1;
```

## dare.get(options Object)

Alternatively an options Object can be used instead.

e.g.

```js
await dare.get({
	table: 'users',
	fields: ['name'],
	filter: {
		id: 1
	}
});
```

### Fields Array `fields`

The `fields` property is the second argument in the shorthand request `dare.get(table,fields[], ...)`. It is an Array of the fields from the matching table to return.

In its simplest form `fields` it is an Array of Strings, e.g. `['id', 'name', 'created_date']`. This creates a very simple query.

```js
await dare.get('users', ['id', 'name', 'created_date'], ...);
// SELECT id, name, created_date FROM ....
```

The array items can also be Objects.

#### Aliased fields and Formatting (objects)

**Aliasing fields**

It's sometimes appropriate to return a field by another name, this is called *aliasing*.

To achieve that, instead of having a string item in the fields array, an object is provided instead. The object has one property where the key of that property defines the new name, and the value the db field.

e.g. here we rename email to emailAddress

```js
await dare.get('users',
	[
		'name', // also including a regular string field alongside for comparison
		{
			// label : db field
			'emailAddress': 'email'
		}
	]
);
// sql: SELECT email AS emailAddress FROM users ...
```

**Applying SQL Formatting**

The object structure used for **aliasing** can also be used to label a response including a SQL Function.

E.g. Below we're using the `DATE` function to format the `created_date`, and we're aliasing it so it will be returned with prop key `date`.

```js
await dare.get('users',
	[
	  {
	  	'date': 'DATE(created_date)'
	  }
	]
);
// sql: SELECT name, DATE(created_date) AS date ...
```


**Supported SQL Functions**:

SQL Functions have to adhere to a pattern. 

*note*: It is currently limited to defining just one table field, we hope this will change

`FUNCTION_NAME([FIELD_PREFIX]? field_name [MATH_OPERATOR MATH_VALUE]?[, ADDITIONAL_PARAMETERS]*)`

- *FUNCTION_NAME*: uppercase, no spaces
- *FIELD_PREFIX*: optional, uppercase
- *field_name*: db field reference
- *MATH_OPERATOR* *MATH_VALUE*: optional
- *ADDITIONAL_PARAMETERS*: optional, prefixed with `,`, (uppercase, digit or quoted string)

*e.g.*

Field Defition | Description
--|--
`FORMAT(field, 2, 'de_DE')` | Rounding to 2 decimal places and convert to a string with German formatting.
`CONCAT(ROUND(field * 100), '%')` | Multiplying a number by 100. Rounding to 2 decimal places and appending a '%' to the end to convert a decimal value to a percentage.
`DATE_FORMAT(field, "%Y-%m-%dT%T.%fZ")` | Format date field
`!ISNULL(field)` | Function prefixed with negation operator `!`

#### Nesting Fields

Nesting can return data structures from across tables. 

*note*: a **Model** Field Attribute `reference`, which defines the join between the two tables, is required to make nested joins.

Request nested data with an object; where the key is the name of the table to be joined, and the value is the Array of fields to return from the joined table.

```js
	// fields attribute...
	[
		'name',
		{
			'country': [
				'name'
			]
		}
	]

	// sql: SELECT name, county.name
```

The SQL this creates renames the fields and then recreates the structured format that was requested. So with the above request: a typical response would have the following structure...

```js
	// Example response
	{
		name: 'Andrew',
		country: {
			name: 'UK'
		}
	}
```

- At the moment this only supports *n:1* mapping.
- The relationship between the tables must be defined in a model field reference.


### Filter `filter`

The Filter Object is a Fields=>Value object literal, defining the SQL condition to attach to a statement.

e.g.

```js

	{
		id: 1,
		is_hidden: 0
	}


	// ... WHERE id = 1 AND is_hidden = 0 ...
```

The filter object can contain nested objects (Similar to the Fields Object). Nested objects define conditions on Relational tables.

*note*: a **Model** Field Attribute `reference`, which defines the join between the two tables, is required to make nested joins.


```js
	{
		country: {
			name: 'UK'
		}
	}
```

OR shorthand, nested subkeys are represented with a '.'

```
	{
		'country.name': 'UK'
	}
```

Creates the following SQL JOIN Condition

```sql
	... WHERE country.name = 'UK' ...
```

#### Filter Syntax

The type of value affects the choice of SQL Condition syntax to use. For example an array will create an `IN (...)` condition.

Prefixing the prop with:

- `%`: creates a `LIKE` comparison
- `-`: hyhen negates the value
- `~`: creates a range


| Key     | Value                     | Type           | = SQL Condition
|---------|---------------------------|----------------|----------------
| id      | 1                         | number         | `id = 1`
| name    | 'Andrew'                  | string         | `name = 'Andrew'`
| %name   | 'And%'                    | Pattern        | `name LIKE 'And%'`
| -%name  | 'And%'                    | Pattern        | `name NOT LIKE 'And%'`
| name$1  | any                  	  | any            | e.g. `name LIKE '%And%` $suffixing gives `name` alternative unique object key values, useful when writing `name LIKE %X% AND name LIKE %Y%`
| tag     | [1, 'a']                  | Array values   | `tag IN (1, 'a')`
| -tag    | [1, 'a']                  | Array values   | `tag NOT IN (1, 'a')`
| -status | ['deleted', null]         | Array values   | `(status NOT IN ('deleted') AND status IS NOT NULL)` Mixed type including `null`
| ~date   | '2016-03-04T16:08:32Z..'  | Greater than   | `date > '2016-03-04T16:08:32Z'`
| ~date   | '2016-03-04..2016-03-05'  | Between        | `date BETWEEN '2016-03-04' AND '2016-03-05'`
| -~date  | '2016-03-04..'            | !Greater than  | `(NOT date > '2016-03-04T00:00:00' OR date IS NULL)`
| flag    | null                      | null           | `flag IS NULL`
| -flag   | null                      | null           | `flag IS NOT NULL`



#### Negate entire joins (i.e. NOT EXISTS)

*note*: a **Model** Field Attribute `reference`, which defines the join between the two tables, is required to make nested joins.

If there is a nested section on a filter which should act to exclude items from the resultset. Then it can be appropriate to use `-` in front of the table name.

Example: Retrieve all users who are *not* in the 'admin' team....
```js
await dare.get({
	table: 'users',
	fields: ['name'],
	filter: {
		-team: {name: 'admin'}
	}
});

// SELECT u.name FROM users u WHERE NOT EXISTS (SELECT 1 FROM team t WHERE name = 'admin' AND t.user_id = u.id)...
```

note: this is very different from having the negation on the field definition, i.e.  `-name:'admin'`, which is described in Filter Syntax.


### Group by `groupby`

`groupby` accepts the same format as a single `field` expression. It can be a single value or an array of multiple expressions. I.e.

```js
groupby: [
	'type',
	'YEAR_MONTH(created_date)'
]
```

Generates
```sql
	GROUP BY type, YEAR_MONTH(created_date)
```

### Order By `orderby`

`orderby` accepts the same format as a single `field` expression. It can be a single value or an array of multiple expressions. I.e.

```js
orderby: [
	'type',
	'YEAR_MONTH(created_date)'
]
```

Generates
```sql
	ORDER BY type, YEAR_MONTH(created_date)
```

### Join

*note*: a **Model** Field Attribute `reference`, which defines the join between the two tables, is required to make nested joins.

The Join Object is a Fields=>Value object literal. It accepts the same syntax to the Filter Object, and defines those conditions on the SQL JOIN Condition.

e.g.

```js

	join: {
		county: {
			is_hidden: 0
		}
	}

	// ... LEFT JOIN county b ON (b.id = a.country_id AND b.is_hidden = 0)
```

The JOIN object is useful when restricting results in the join table without affecting the results returned in the primary table.

To facilitate scenarios where the optional JOIN tables records are dependent on another relationship we can define this also in the JOIN Object, by passing though a special prop `_required: true` (key=>value)

The following statement includes all rows as before, but the nested country data is filtered separatly.

```js

	join: {
		county: {
			continent: {
				_required: true,
				name: 'Europe'
			}
		}
	}

	// ...
	// LEFT JOIN county b ON (b.id = a.country_id)
	// LEFT JOIN continent c ON (c.id = b.continent_id)
	// WHERE (c.id = b.continent_id OR b.continent_id IS NULL)
	// ...
```

### Pagination `limit` and `start`

The `limit` and `start` properties are simply applied to the SQL query and can be used to paginate the resultset.

```js
await dare.get({
	table: 'table',
	fields: ['name'],
	limit: 10, // Return only 10 rows
	start: 20, // Start in the 20th
});
// SELECT name FROM table LIMIT 10 OFFSET 20;
```

### No `limit` set and `notfound`
Dare returns a single item when no `limit` is set. When the item is not found Dare rejects the request with `DareError.NOT_FOUND`. To override this default behaviour simply set the `notfound` to the value to respond with in the event of a notfound event being triggered. This can be a simple value or if a function is provided, then that function will be called e.g.

```js
const resp = await dare.get({
	table: 'table',
	fields: ['name'],
	filter: {name: 'Nameless'}
	notfound: null
});

// SELECT name FROM table WHERE name = 'Nameless' LIMIT 1;
// -- found 0 rows
console.log(resp); // null

```

## dare.getCount(table[, filter][, options])

The `dare.getCount` method like the `dare.get` method builds and executes a `SELECT ...` SQL statement. It differs from the `get` in that it does not operate on the `fields` option. It merely calculates and returns the number of results which match the request options. It is intended to be used when constructing pagination, or other summaries.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to access
| filter   | Hash (key=>Value) | Query Object
| options  | Hash (key=>Value) | Additional Options

e.g.

```js
const count = await dare.getCount('profile', {first_name: 'Andrew'});
// SELECT COUNT(DISTINCT id) FROM profile WHERE name = 'Andrew' LIMIT 1;
```

## dare.getCount(options Object)

Using an options Object allows for  `date.getCount(options)` to be paired with a request to `dare.get(options)`.

e.g.

```js
const requestOptions = {
	table: 'profile',
	filter: {
		first_name: 'Andrew'
	},
	limit: 10
};

// Get the first 10 items, and the number of possible rows
const [items, foundRows] = await Promise.all([

	// Make a request for members matching the condition 
	dare.get(requestOptions)

	// Get the number of possible results
	dare.getCount(requestOptions)
]);
```



## dare.post(table, body[, options])

The `dare.post` method is used to build and execute an `INSERT ...` SQL statement.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to insert into
| body     | Object            | Post Object or Array of Post Objects
| options  | Hash (key=>Value) | Additional Options

e.g.

```js
await dare.post('user', {name: 'Andrew', profession: 'Mad scientist'});
// INSERT INTO table (name, profession) VALUES('Andrew', 'Mad scientist')
```

## dare.post(options Object)

Alternatively a options Object can be used instead.

e.g.

```js
await dare.post({
	table: 'user',
	body: {
		name: 'Andrew',
		profession: 'Mad scientist'
	}
});

```

## dare.post(options Object) with multiple values

The body can be an Array of objects.

e.g.

```js
await dare.post({
	table: 'user',
	body: [{
		name: 'Andrew',
		profession: 'Mad scientist'
	}, {
		name: 'Peppa'
	}]
});
```

This generates `INSERT INTO user (name, profession) VALUES ('Andrew', 'Mad Scientist'), ('Peppa', DEFAULT)`. Note where the key's differ between items in the Array the `DEFAULT` value is inserted instead. 

### Post `options` (additional)

| Prop          | Type             | Description
|---------------|------------------|----------------
| duplicate_keys | 'ignore'         | Appends `ON DUPLICATE KEYS UPDATE _rowid=_rowid`
| duplicate_keys_update | Array(field1, field2, ...) | Appends `ON DUPLICATE KEYS UPDATE field1=VALUES(field1)`


## dare.patch(table, filter, body[, options])

Updates records within the `table` with the `body` object when they match `filter`.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to insert into
| filter   | Object            | Filter object of the results
| body     | Object            | Post Object to apply
| options  | Hash (key=>Value) | Additional Options


### Patch `options` (additional)

| Prop          | Type      | Description
|---------------|-----------|----------------
| duplicate_keys | 'ignore' | Adds keyword `IGNORE`, e.g. `UPDATE IGNORE table ...`
| limit         | number    | Default: `1`. Limit the number of results which can be affected by patch
| notfound      | *         | Value to return when there are no affected rows. If it's a function the function will be called. Default throws `DareError.NOT_FOUND`


## dare.del(table, filter[, options])

Deletes records within the `table` when they match `filter`.

| property | Type              | Description
|----------|-------------------|----------------
| table    | string            | Name of the table to insert into
| filter   | Object            | Filter object of the results
| options  | Hash (key=>Value) | Additional Options


### Del `options` (additional)

| Prop          | Type      | Description
|---------------|-----------|----------------
| notfound      | *         | Value to return when there are no affected rows. If it's a function the function will be called. Default throws `DareError.NOT_FOUND`
| limit         | number    | Default: `1`. Limit the number of results which can be affected by delete








# `options` Object

The `options` Object is used to define properties on the current and descendent contexts. In other words, every method in Dare, creates a new instances inheritting its parent options as well as defining it's own. See `dare.use(options)` for more.

The `options` themselves are a set of properties used to interpret and manipulate the request.

```js
// Create an options Object
const options = {
	// Some options...
}

// Apply options at the point where Dare is invoked...
const dare = new Dare(options);

// OR Apply options when creating an instance off another instance...
const dare2 = dare.use(options);

// OR Apply options at the point of calling a method...
await dare.get({
	table: 'sometable',
	fields: ['id', 'name'],
	...options
})
```

As you can see, to apply `options` you have... um *options*.

# `options.models`

The `options.models` object, allows us to apply all our models to Dare. Where the object key is the label for which we'll refer to that model.

See next section **Model** for what a model looks like.


```js
// options Object containing a property called `models`
// Models is a key => model store, where the key is what we'll always refer to as the label for that model.
const options = {
	models: {
		// modelA,
		// modelB,
		// etc...
	}
}

// options applied to dare as before.
```

# Model

Perhaps the most important part of the **Dare** library is concept of a **model**.

A **model** defines:
- how data is interlinked, i.e. how one relational data table is joined to another via a key
- mutation handlers, for changing requests. This allows access permissions to be applied, to filter results, to restrict or mutate input data.

E.g. here are available properties which can be defined on a model, 

```js
const myModel = {
	table, // this is the db table name, if omitted Dare will assume the models label instead
	schema, // A schema object defining fields, as well as their relationship to other models.
	get, // Function to modify the request when accessing data
	post, // Function to modify the request when posting data
	patch, // Function to modify the request when patching data
	del, // Function to modify the request when deleting data
}
```


## Model Table `table`

The underlying Database SQL Table to use when querying this model, if omitted Dare will assume the models label instead

```js
const myModel = {
	table: 't_mytable' // an example table name: some dba's do like to prefix table names, however it's not a convention which makes for a nice api.
	// ...
}
```
## Model Schema `schema`

The `schema` property defines an object, containing field attribute references in key=>value pair, i.e. `fieldName (key) => field attributes (value)`.

```js
const mySchema = {
	id, // id field attributes
	name, // name field attributes
	//etc...
}
```

### Field Attributes

Can define how a field corresponds to a DB table field, whether it's readable/writable, is it a generated field, as well as relationships between models.

Defining a field attribute, can be verbose using an object with special keys, or can be shorthanded with specific datatypes

Property | Attr Example | Shorthand DataType | ShortHand Example | Description
--|--|--|--|--
`reference` | e.g. `{reference: ['country.id']}` | `Array` | `county_id: ['country.id']` | Relationship with other models
`alias` | e.g. `{alias: 'email'}` | `String` | `emailAddress: 'email'` | Alias a field with a DB Table field
`handler` | e.g. `{handler: Function}` | `Function` | `url: urlFunction` | Generated Field
`type` | e.g. `{type: 'json'}` | na | na | Type of data in field, this has various uses.
`readable` | e.g. `{readable: false}` | na | na | Disables/Enables request access to a field
`writeable` | e.g. `{writeable: false}` | na | na | Disables/Enables write access to a field
na | e.g. `{writeable: false: readable: false}` | `Boolean` | `{password: false}` | Disables/Enables both write and read access to a field


Fields dont need to be explicitly defined in the `options.models.*tbl*.schema` where they map one to one with a DB table fields the request will just go through verbatim.


#### Field attribute: `reference`

In the example below the fields `users.country_id` defines a reference with `country.id` which is used to construct SQL JOIN Conditions.


```js
const dare = new Dare({
	models : {
		users: {
			schema: {
				// users fields...
				country_id: ['country.id']
			},
		},
		country: {
			schema: {
				// country fields...
				id: {}
			},
		}
	}
});
```

#### Field attribute: `type`

Defining the `type` introduces additional features.

**`datatime`**

Setting value to 'datetime', a conditional filter short hand for `created_time: 2017` would be expanded to `created_time BETWEEN '2017-01-01T00:00:00' AND '2017-12-31T23:59:59`

```js
const dare = new Dare({
	models: {
		users: {
			schema: {
				created_time: {
					type: 'datetime'
				}
			}
		}
	}
});
```

**`json`**

Serializes Objects and Deserializes JSON strings in `get`, `post` and `patch` operations.

e.g.

Schema: field definition...
```js
const dare = new Dare({
	models: {
		users: {
			schema: {
				meta: {
					// Define a field meta with data type of json
					type: 'json'
				}
			}
		}
	}
});
```

Example set and get
```js
	// Arbitary object...
	const meta = {
		prop1: 1,
		prop2: 2
	};

	// For a field named `meta`
	const {insertId: id} = await dare.post('users', {meta});
	// The value is run through JSON.stringify before insertion
	// INSERT INOT users (meta) VALUES('{"prop1": 1, "prop2": 2}')


	...

	// The value is desiralized, when accessed via get...
	const {meta} = await dare.get('users', ['meta'], {id});

	// e.g...
	console.log(meta);
	// Object({
	// 	prop1: 1,
	// 	prop2: 2
	// });

```


#### Field attribute: `handler`

When the value is a function, the function will be invoked when interpretting the request as part of a field value. The response of this function can either be a static value or it can be an additional function which is optionally run on all items in the response, to return a generated field.

E.g.

This will manipulate the request and response to create the property `avatar_url` on the fly.

```js
const dare = new Dare({
	models: {
		users: {
			schema: {
				avatar_url(fields) {

					fields.push('id'); // require additional field from users table.

					return (item) => `/images/avatars/${item.id}`;
				}
			}
		}
	}
});
```

#### Field attribute: `alias`

To alias a field, so that you can use a name different to the db column name, assign it a string name of the field in the current table. e.g. `emailAddress: 'email'`


```js
const dare = new Dare({
	models: {
		users: {
			schema: {
				emailAddress: 'email'
			}
		}
	}
});
```

For example this will allow us to use the alias `emailAddress` in our api (see below), but the SQL generated will refer to it with it's true field name "`email`".

```js
await dare.get('users', ['emailAddress'], {emailAddress: 'andrew@%'});
// SELECT email AS emailAddress FROM users WHERE email LIKE 'andrew@%'

await dare.post('users', {emailAddress: 'andrew@example.com'});
// INSERT INTO users (email) VALUES ('andrew@example.com')

```

The aliasing can also be used for common functions and define fields on another table to abstract away some of the complexity in your relational schema and provide a cleaner api interface.

e.g.
```js
const dare = new Dare({
	models: {
		users: {
			schema: {
				emailAddress: {
					// Explicitly define the alias
					// Reference the email define on another table, we can also wrap in SQL functions.
					alias: 'LOWER(usersEmails.email)'
				}
			}
		},
		// Any cross table join needs fields to map
		usersEmails: {
			schema: {
				user_id: ['users.id']
			}
		}
	}
});
```

#### Field attribute: `readable`/`writeable`

A flag to control access to a field

```js
const dare = new Dare({
	models: {
		users: {
			schema: {
				// Explicit object
				id: {
					readable: true,
					writeable: false // non-writeable
				},

				// Shorthand for non-readable + non-writeable
				password: false 
			}
		}
	}
})
```

With the above `writeable`/`readable` field definitions an error is thrown whenever attempting to access the field e.g.

```js
await dare.get('users', ['password'], {id: 123});
// throws {code: INVALID_REFERENCE}
```

Or when trying to modify a field through `post` or `patch` methods, e.g.

```js
await dare.patch('users', {id: 321}, {id: 1337});
// throws {code: INVALID_REFERENCE}
```


## `model.get`

Here's an example of setting a model to be invoked whenever we access `users` model, we'll go into each of the properties afterwards.

```js
function get(options) {
	options.filter.deleted = null;
}

// For completeness we'll assume the new Dare instance approach for adding the options...
const dare = new Dare({
	models: {
		users: {
			get
		}
	}
});

// Here we're using `table:users`, so the model's `get` Function would be invoked
await dare.get({
	table: 'users',
	fields: ['name'],
	limit: 100
});

// SELECT name FROM users WHERE deleted = false LIMIT 100;
```

# Data validation

Dare has limited validation built in (see above). Set your own `validationInput` to check input values being applied in `patch` and `post` operation.

## validateInput(fieldAttributes, field, value)

The `validateInput` validation is called after any method model handlers. It contains the following parameters... 

| property        | Type    | Description
|-----------------|---------|----------------
| fieldAttributes | Object  | Field Attributes
| field           | string  | Field Name
| value           | *       | Input value


e.g. 

```js
dare.use({
	models: {
		// Member Model
		member: {
			schema: {
				username: {
					required: true,
					type: 'string',
					maxlength: 5,
					test(value) {
						if(!/\W/.test(value)) {
							throw new Error(`😞: username should only contain alphabetical characters`);
						}
					}
				},
				age: {
					// Another field
				}
			}
		}
	},

	validateInput(fieldAttributes, field, value) {
		if (!fieldAttribute) {
			throw new Error(`😞: ${field} field is unknown`);
		}
		if (fieldAttributes.required && value === undefined) {
			throw new Error(`😞: ${field} is missing`);
		}
		if (fieldAttributes.type && typeof (value) !== 'string') {
			throw new Error(`😞: ${field} should be a string`);
		}
		if (fieldAttributes.maxlength && value.length > fieldAttributes.maxlength) {
			throw new Error(`😞: ${field} should be less than ${fieldAttributes.maxlength} characters`);
		}
		fieldAttributes.test?.(value);
	}
});

// Then see what errors you'd get...

dare.post('member', {username: 'Fine', hello: "What's this?"});
// 😞: hello field is unknown

dare.post('member', {age: 5});
// 😞: username is missing

dare.post('member', {username: 123});
// 😞: username should be a string

dare.post('member', {username: 'Thisistoolong'});
// 😞: username should be less than 5 characters

dare.post('member', {username: 'No strange characters !@£$%^YU'});
// 😞: username should only contain alphabetical characters

```

### default attributes of model schema

The `default` field definition can be defined per model. This is useful to say when to be strict with unknown fields.

e.g. 

```js
dare.use({
	models: {
		// Member Model
		member: {
			schema: {
				default: {
					// Be strict with the member model
					writeable: false
				},
				// ... other field definitions below
			}
		}
	},

	validateInput(fieldAttributes, field, value) {
		if (!fieldAttribute) {
			// Do nothing, We have no field definitions for this model
			console.log(`Someone should write field definitions for ${field} 👉`);
		}
		if (fieldAttributes.writeable === false) {
			throw new Error(`😞: ${field} field is un-writeable`);
		}
		// ... other validation rules below
	}
});

// So on the member table the default field would be replaced with an unknown field and would be caught
dare.post('member', {hello: "What's this?"});
// 😞: hello is un-writeable

// Whilst the same unknown field would be allowed through where the default field is not declared
dare.post('emails', {hello: "What's this?"});
// Someone should write field definitions for hello 👉`
```


# Additional Options

## Multiple joins/filters on the same table

In order to both: show all relationship on the join table AND filter the main results by the joined table. One can either create separate table aliases (as described above) using one for the field name, and one for the filter. Or alternatively append an arbitary label, a `$` sign followed by an string. E.g.

E.g. Include all the tags associated with users AND only show users whom include the tag "Andrew"


```js
await dare.get({
	table: 'users',
	fields: ['name', {'tags': ['name']}],
	filter: {
		tags$a: {
			name: 'Andrew'
		}
	}
});
```

This will get all users who contain atleast the tags 'Andrew', as well as returning all the other tags.


## After Handlers

An `dareInstance.after` handler is executed after the initial request has completed but before Dare has resolved the call. This makes it useful for logging as well as manipulating the response. If the handler returns `undefined` or `Promise<undefined>` then the original response is returned unaltered. And anything other than `undefined` will become the new response.

E.g. here is an example using the `after` handlers in the `users.patch` model to record a transaction.

```js
options.models.users = {
	async patch(options, dareInstance) {

		/**
		 * Check that the data to be modified
		 * By using the options to construct a SELECT request first
		 */

		// Clonse the options
		const opts = {
			...options,
			fields: ['id', 'name']
		};

		// Execute a dare.get with the cloned options
		const {id: ref_id, name: previous_name} = await dare.get(opts);

		// Set the after handler
		dareInstance.after = () => {
			dare.post('changelog', {
				message: 'User updated',
				type: 'users',
				ref_id,
				previous_name
			})

			// Returns undefined so no change
		};
	}
};

```

### Handling dates and date ranges

The library supports a number of user friendly ways of passing in dates and date ranges by constructing the formal timestamp implied in the data passed to Dare.

E.g. here is a list of supported syntaxes and the resulting timestamp.

```
2018-01-01..2018-01-02,
2018-01-01..02,
2018-1-1..2

=== 2018-01-01T00:00:00..2018-01-02T23:59:59

etc...
```


### Changing the default MAX_LIMIT

By default the maximum value for a `limit` option is set by `dare.MAX_LIMIT`, you can override this in an instance of Dare.

```js
import Dare from 'dare';

// Initiate it
const dare = new Dare();

await dare.MAX_LIMIT = 1000000;
```

### Disabling intermediate model joins `infer_intermediate_models`

By default `infer_intermediate_models = true`. This allows two models which share a common relationship with another model to be joined in a query directly. However sometimes this can be unpredictable if there are potentially more than one shared references between the models. In which case you would need to use explicit full paths, you then might like to disable `infer_intermediate_models` so that you catch anything which doesn't tow the line.

```js
// Disable intermediate models

// On new instance
const dare = new Dare({infer_intermediate_models: false});

// On extended instance
const dareInst = dare.use({infer_intermediate_models: false);

// On individual queries...
await dare.get({
	// ... other options
	infer_intermediate_models: false
});
```

### Infering conditional operators based on value `conditional_operators_in_value`

By default `conditional_operators_in_value = '!%'`. Which is a selection of special characters within the value to be compared.

- `%`: A string containing `%` within the value to be compared will indicate a wild character and the SQL `LIKE` conditional operator will be used.
- `!`: A string starting with `!` will negate the value using a SQL `LIKE` comparison operator.
- `..`: A string containing `..` will use a range `BETWEEN`, `<` or `>` comparison operator where a string value contains `..` or the value is an array with two values (dependending if the first or second value is empty it will use `<` or `>` respecfively). This denotes a range and is enabled using the `~` operator (because `.` within prop name has another meaning)

```js
// Enabling support for one or more of the above special characters...

// On new instance
const dare = new Dare({conditional_operators_in_value: '%!~'});

// On extended instance
const dareInst = dare.use({conditional_operators_in_value: '%!~');

// On individual queries...
await dare.get({
	table: 'mytable',
	fields: ['id'],
	filter: {name: '%compare%', created: '2022-01-01..'}
	conditional_operators_in_value: '%!~'
});

// ... SELECT id FROM mytable WHERE name LIKE '%compare%' AND created > '2022-01-01' 

// The same query with the option disabled
await dare.get({
	table: 'mytable',
	fields: ['id'],
	filter: {name: '%compare%', created: '2022-01-01..'}
	conditional_operators_in_value: ''
});

// Fallbacks to the '=' conditional operator
// ... SELECT id FROM mytable WHERE name = '%compare%' AND created = '2022-01-01..'

```

### Post format the response

The `dare.response_row_handler` is a little helper to format or redirect the response data as it's being processed. Using this approach to post-processing should give better performance on large datasets.

E.g.

```js
// create a new dare instance to avoid polluting the others.
dare = dare.use(); 

// Define a response_row_handler on the new instance...
await dare.response_row_handler = (item) => {
	// rudimentary write out as CSV.
	res.write(Object.keys(item).join(',') + '\n');

	// Do not return anything unless you want to include it in `data` (see below)
};

// Execute the query
const data = await dare.get('users', ['name'], {limit: 10000000});

console.log(data.length === 0); // empty array
```


### Overriding table schema per operation

You can override the schema per operation using the `models` option:

E.g.

```js
// On an instance, or create new instance with newDareInstance = dare.use(options)
const dare = new Dare({
	models: {
		my_table: {
			schema: {
				a_write_protected_field: {
					type: 'datetime',
					writeable: false,
				}
			}
		},
	}
});

// On an individual request
await dare.patch({
	table: 'my_table',
	body: {
		a_write_protected_field: 'new value,
	},
	models: {
		my_table: {
			schema: {
				write_protected_field: {
					writeable: true,
				},
			}
		},
	},
});
```
